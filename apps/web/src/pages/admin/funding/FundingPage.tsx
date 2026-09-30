import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote,
  HandCoins,
} from "lucide-react";
import { DonationsManagement } from "@/pages/admin/DonationsManagement";
import {
  getAdminFunds,
  getAdminPayments,
  getAdminWithdrawals,
  createAdminFund,
  setAdminFundStatus,
  decideWithdrawal,
  type AdminFund,
  type FundStatus,
  type PaymentStatus,
} from "@/data/adminFunding";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type FundingTab = "funds" | "contributions" | "payments" | "withdrawals";

const TABS: { id: FundingTab; label: string; icon: typeof Wallet }[] = [
  { id: "funds", label: "Funds", icon: Wallet },
  { id: "contributions", label: "Contributions", icon: HandCoins },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "withdrawals", label: "Withdrawals", icon: Banknote },
];

const TAB_PATH: Record<FundingTab, string> = {
  funds: "/admin/funding",
  contributions: "/admin/funding/contributions",
  payments: "/admin/funding/payments",
  withdrawals: "/admin/funding/withdrawals",
};

const FUND_STATUS_STYLES: Record<FundStatus, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  closed: "bg-orange-100 text-orange-700",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  succeeded: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
      <CheckCircle2 className="h-4 w-4 text-green-400" />
      {message}
    </div>
  );
}

export function FundingPage({ tab }: { tab: FundingTab }) {
  const navigate = useNavigate();
  const [funds, setFunds] = useState<AdminFund[]>(() => getAdminFunds());
  const [withdrawals, setWithdrawals] = useState(() => getAdminWithdrawals());
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // New fund form
  const [form, setForm] = useState({ name: "", type: "city" as AdminFund["type"], citySlug: "", target: "", description: "" });
  const [saving, setSaving] = useState(false);

  const payments = useMemo(() => getAdminPayments(paymentFilter === "all" ? undefined : paymentFilter), [paymentFilter]);
  const allPayments = useMemo(() => getAdminPayments(), []);

  const fundStats = useMemo(() => {
    const balance = funds.reduce((s, f) => s + f.balance, 0);
    const target = funds.reduce((s, f) => s + f.target, 0);
    return { balance, target, active: funds.filter((f) => f.status === "active").length };
  }, [funds]);

  const paymentStats = useMemo(() => {
    const succeeded = allPayments.filter((p) => p.status === "succeeded");
    return {
      volume: succeeded.reduce((s, p) => s + p.amount, 0),
      fees: succeeded.reduce((s, p) => s + p.fee, 0),
      pending: allPayments.filter((p) => p.status === "pending").length,
    };
  }, [allPayments]);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleCreateFund = async () => {
    if (!form.name.trim() || !form.target) return;
    setSaving(true);
    await createAdminFund({
      name: form.name.trim(),
      type: form.type,
      citySlug: form.type === "city" ? (form.citySlug.trim() || null) : null,
      target: Math.round(Number(form.target) * 100),
      description: form.description.trim() || "No description yet.",
    });
    setFunds(getAdminFunds());
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", type: "city", citySlug: "", target: "", description: "" });
    notify("Fund created as draft.");
  };

  const handleFundStatus = async (id: string, status: FundStatus) => {
    setBusyId(id);
    await setAdminFundStatus(id, status);
    setFunds(getAdminFunds());
    setBusyId(null);
    notify(`Fund marked ${status}.`);
  };

  const handleWithdrawalDecision = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    await decideWithdrawal(id, decision);
    setWithdrawals(getAdminWithdrawals());
    setBusyId(null);
    notify(decision === "approved" ? "Withdrawal approved." : "Withdrawal rejected.");
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-900">Funding</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Funding</h1>
          <p className="text-sm text-gray-500">Funds, contributions, payments and withdrawal requests.</p>
        </div>
        <Link
          to="/admin/settings/payments"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Payment rules &amp; settings
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigate(TAB_PATH[id])}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "withdrawals" && pendingWithdrawals.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FUNDS ── */}
      {tab === "funds" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi icon={<Wallet className="h-3.5 w-3.5" />} label="Total balance" value={fmt(fundStats.balance)} hint="Across all funds" />
            <Kpi icon={<Banknote className="h-3.5 w-3.5" />} label="Combined target" value={fmt(fundStats.target)} hint={`${funds.length} funds`} />
            <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Active funds" value={`${fundStats.active}`} hint={`${funds.length - fundStats.active} draft/closed`} />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">All Funds</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" /> Create Fund
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Fund</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funds.map((f) => {
                  const pct = f.target > 0 ? Math.min(100, Math.round((f.balance / f.target) * 100)) : 0;
                  return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{f.name}</div>
                        <div className="text-xs text-gray-400">{f.description}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-500">{f.type}{f.citySlug ? ` · ${f.citySlug}` : ""}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(f.balance)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(f.target)}</td>
                      <td className="px-4 py-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FUND_STATUS_STYLES[f.status]}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {f.status !== "active" && (
                            <button
                              disabled={busyId === f.id}
                              onClick={() => handleFundStatus(f.id, "active")}
                              className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                          {f.status === "active" && (
                            <button
                              disabled={busyId === f.id}
                              onClick={() => handleFundStatus(f.id, "closed")}
                              className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONTRIBUTIONS ── */}
      {tab === "contributions" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <DonationsManagement />
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi icon={<CreditCard className="h-3.5 w-3.5" />} label="Succeeded volume" value={fmt(paymentStats.volume)} hint={`${allPayments.length} payments total`} />
            <Kpi icon={<Banknote className="h-3.5 w-3.5" />} label="Processing fees" value={fmt(paymentStats.fees)} hint="On succeeded payments" />
            <Kpi icon={<RefreshCw className="h-3.5 w-3.5" />} label="Pending" value={`${paymentStats.pending}`} hint="Awaiting settlement" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "succeeded", "pending", "refunded", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPaymentFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                  paymentFilter === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Donor</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.ref}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.donor}</td>
                    <td className="px-4 py-3 text-gray-500">{p.campaign}</td>
                    <td className="px-4 py-3 text-gray-500">{p.method.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(p.fee)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.date}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                      No {paymentFilter} payments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── WITHDRAWALS ── */}
      {tab === "withdrawals" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              icon={<HandCoins className="h-3.5 w-3.5" />}
              label="Pending requests"
              value={`${pendingWithdrawals.length}`}
              hint={fmt(pendingWithdrawals.reduce((s, w) => s + w.amount, 0)) + " awaiting decision"}
            />
            <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Approved" value={`${withdrawals.filter((w) => w.status === "approved").length}`} hint="Released to recipients" />
            <Kpi icon={<XCircle className="h-3.5 w-3.5" />} label="Rejected" value={`${withdrawals.filter((w) => w.status === "rejected").length}`} hint="Returned for review" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{w.recipient}</div>
                      <div className="text-xs text-gray-400">{w.note}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{w.campaign}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(w.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{w.method}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{w.requestedAt}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          w.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : w.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {w.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            disabled={busyId === w.id}
                            onClick={() => handleWithdrawalDecision(w.id, "approved")}
                            className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={busyId === w.id}
                            onClick={() => handleWithdrawalDecision(w.id, "rejected")}
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create fund modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Create Fund</h3>
            <p className="mt-1 text-xs text-gray-500">New funds start as drafts until activated.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Leeds City Fund"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AdminFund["type"] })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="city">City</option>
                    <option value="community">Community</option>
                    <option value="founding">Founding</option>
                    <option value="strategic">Strategic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Target (£) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    placeholder="50000"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {form.type === "city" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">City slug</label>
                  <input
                    value={form.citySlug}
                    onChange={(e) => setForm({ ...form, citySlug: e.target.value })}
                    placeholder="leeds"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateFund}
                disabled={saving || !form.name.trim() || !form.target}
                className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Fund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
