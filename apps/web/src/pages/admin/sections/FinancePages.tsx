// =============================================================================
// Admin — Finance sections
// =============================================================================

import { useEffect, useState } from "react";
import {
  adminApi,
  type FinanceOverview,
  type AdminPayout,
  type RecentContribution,
} from "@/services/admin";
import {
  AdminPageHeader,
  AdminLoading,
  AdminError,
  AdminEmpty,
  AdminTable,
  StatCard,
  StatusPill,
  fmtGbp,
  fmtDate,
} from "./shared";
import { Wallet } from "lucide-react";

// ─── Financial Overview ─────────────────────────────────────────────────────

export function FinancialOverviewPage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getFinanceOverview()
      .then((res) => {
        setOverview(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;
  if (!overview) return <AdminEmpty message="No financial data available." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Financial Overview" description="Platform-wide financial summary." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Gross Contributions" value={fmtGbp(overview.totalGross)} />
        <StatCard label="Refunded" value={fmtGbp(overview.totalRefunded)} />
        <StatCard label="Net" value={fmtGbp(overview.totalNet)} />
        <StatCard label="Estimated Platform Fees" value={fmtGbp(overview.estimatedPlatformFees)} />
        <StatCard
          label="Pending Payouts"
          value={fmtGbp(overview.pendingPayouts.amount)}
          sub={`${overview.pendingPayouts.count} requests`}
        />
        <StatCard label="Available Escrow Balance" value={fmtGbp(overview.availableEscrowBalance)} />
      </div>
    </div>
  );
}

// ─── Payouts ────────────────────────────────────────────────────────────────

export function PayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getPayouts({ limit: 100 })
      .then((res) => {
        setPayouts(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const decide = (id: string, status: "APPROVED" | "REJECTED") => {
    setBusy(id);
    adminApi
      .updatePayoutStatus(id, { status })
      .then(() => setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p))))
      .finally(() => setBusy(null));
  };

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payouts" description="Process and manage payouts to businesses." />
      {payouts.length === 0 ? (
        <AdminEmpty message="No payout requests." />
      ) : (
        <AdminTable columns={["Business", "Amount", "Method", "Status", "Requested", "Action"]}>
          {payouts.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{p.business?.name ?? p.businessId}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(p.amount)}</td>
              <td className="px-4 py-3 capitalize text-gray-500">{p.method.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(p.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                {p.status === "PENDING" ? (
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={busy === p.id}
                      onClick={() => decide(p.id, "APPROVED")}
                      className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy === p.id}
                      onClick={() => decide(p.id, "REJECTED")}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Refunds ────────────────────────────────────────────────────────────────

export function RefundsPage() {
  const [donations, setDonations] = useState<RecentContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getDonations({ limit: 100 })
      .then((res) => {
        setDonations(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const refund = (id: string) => {
    setBusy(id);
    adminApi
      .refundDonation(id, { reason: "Admin refund" })
      .then(() => setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status: "REFUNDED" } : d))))
      .finally(() => setBusy(null));
  };

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Refunds & Adjustments" description="Handle refunds for contributions." />
      {donations.length === 0 ? (
        <AdminEmpty message="No contributions to refund." />
      ) : (
        <AdminTable columns={["Reference", "Campaign", "Amount", "Status", "Date", "Action"]}>
          {donations.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.reference ?? d.id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-gray-900">{d.campaign?.title ?? "—"}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(d.amount)}</td>
              <td className="px-4 py-3">
                <StatusPill status={String(d.status)} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(d.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                {String(d.status).toUpperCase() === "COMPLETED" ? (
                  <button
                    disabled={busy === d.id}
                    onClick={() => refund(d.id)}
                    className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Refund
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Balances (no dedicated backend yet) ────────────────────────────────────

export function BalancesPage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);

  useEffect(() => {
    adminApi.getFinanceOverview().then(setOverview).catch(() => setOverview(null));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Balances & Allocations" description="Fund balances and allocation rules." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Available Escrow Balance" value={fmtGbp(overview?.availableEscrowBalance ?? 0)} />
        <StatCard label="Pending Payouts" value={fmtGbp(overview?.pendingPayouts.amount ?? 0)} />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <Wallet className="h-4 w-4" /> Detailed balance allocation and spillover rules are managed per
        campaign and season.
      </div>
    </div>
  );
}
