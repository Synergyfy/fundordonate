import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, PackageCheck, Truck, Clock, XCircle, Search, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { adminApi, type AdminFulfilment } from "@/services/admin";

type FulfilmentStatus = "issued" | "dispatched" | "delivered" | "failed" | "retry_pending";

const STATUSES: FulfilmentStatus[] = ["issued", "dispatched", "delivered", "failed", "retry_pending"];

/** Normalise the API's free-form fulfilment status to a known display status. */
function normaliseStatus(raw: string | undefined, retryPending = false): FulfilmentStatus {
  if (retryPending) return "retry_pending";
  const value = (raw ?? "").toLowerCase();
  if (
    value === "dispatched" ||
    value === "delivered" ||
    value === "failed" ||
    value === "retry_pending" ||
    value.startsWith("pending")
  ) {
    return value.startsWith("pending") ? "retry_pending" : (value as FulfilmentStatus);
  }
  return "issued";
}

const STATUS_STYLES: Record<FulfilmentStatus, string> = {
  issued: "bg-yellow-100 text-yellow-700",
  dispatched: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  retry_pending: "bg-amber-100 text-amber-700",
};

const FILTERS: { id: "all" | FulfilmentStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "issued", label: "Issued" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
  { id: "failed", label: "Failed" },
  { id: "retry_pending", label: "Retry pending" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function FulfilmentPage() {
  const [records, setRecords] = useState<AdminFulfilment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | FulfilmentStatus>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    adminApi
      .getFulfilments({ limit: 200 })
      .then((res) => {
        setRecords(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setRecords([]);
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const status = normaliseStatus(r.status, r.retryPending);
        if (filter !== "all" && status !== filter) return false;
        if (search) {
          const haystack = `${r.reward?.name ?? ""} ${r.recipientName ?? ""} ${r.recipientEmail ?? ""} ${r.campaignTitle ?? ""} ${r.id}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [records, filter, search]
  );

  const counts = useMemo(() => {
    const byStatus: Record<FulfilmentStatus, number> = {
      issued: 0,
      dispatched: 0,
      delivered: 0,
      failed: 0,
      retry_pending: 0,
    };
    for (const r of records) byStatus[normaliseStatus(r.status, r.retryPending)] += 1;
    return byStatus;
  }, [records]);

  const updateStatus = (id: string, status: FulfilmentStatus, message: string) => {
    setBusyId(id);
    adminApi
      .updateFulfilment(id, { status })
      .then(() => {
        setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        setToast(message);
        setTimeout(() => setToast(null), 2400);
      })
      .catch(() => {
        setToast("Could not update fulfilment. Please try again.");
        setTimeout(() => setToast(null), 3000);
      })
      .finally(() => setBusyId(null));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/rewards/library" className="hover:text-gray-700">Rewards</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-900">Fulfilment</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reward Fulfilment</h1>
        <p className="text-sm text-gray-500">Track issued rewards through dispatch and delivery.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Clock className="h-3.5 w-3.5" /> Issued</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.issued}</div>
          <div className="text-xs text-gray-400">Awaiting dispatch</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><RotateCcw className="h-3.5 w-3.5" /> Retry pending</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.retry_pending}</div>
          <div className="text-xs text-gray-400">Awaiting activation / retry</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Truck className="h-3.5 w-3.5" /> Dispatched</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.dispatched}</div>
          <div className="text-xs text-gray-400">In transit / sent</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><PackageCheck className="h-3.5 w-3.5" /> Delivered</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.delivered}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><XCircle className="h-3.5 w-3.5" /> Failed</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.failed}</div>
          <div className="text-xs text-gray-400">Needs re-issue</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rewards, recipients…"
            className="w-64 rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <Link to="/admin/rewards/library" className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700">
          Reward library →
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <h3 className="mb-1 font-semibold text-gray-900">Fulfilment records could not be loaded</h3>
          <p className="mb-4 text-sm text-gray-600">Something went wrong while loading fulfilment records.</p>
          <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                  </td>
                </tr>
              )}
              {!loading && filtered.map((r) => {
                const status = normaliseStatus(r.status, r.retryPending);
                const isDigital = Boolean(r.isDigital);
                const needsRetry = status === "failed" || status === "retry_pending";
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="mr-1.5">{r.reward?.icon ?? "🎁"}</span>
                      {r.reward?.name ?? "Reward"}
                      {r.fulfilmentKind && (
                        <div className="text-[11px] font-normal uppercase tracking-wide text-gray-400">
                          {r.fulfilmentKind.replace(/_/g, " ")}
                          {isDigital ? " · digital" : ""}
                        </div>
                      )}
                      {needsRetry && r.fulfilmentError && (
                        <div className="mt-1 max-w-xs text-xs font-normal text-red-600">{r.fulfilmentError}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="font-medium text-gray-700">{r.recipientName ?? "—"}</div>
                      {r.recipientEmail && <div className="text-xs text-gray-400">{r.recipientEmail}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.campaignTitle ?? r.campaignId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                        {status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {needsRetry ? (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => updateStatus(r.id, "issued", "Reward retry queued.")}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Re-issue
                        </button>
                      ) : isDigital ? (
                        <span className="text-xs text-gray-400">
                          {status === "delivered" ? "Delivered digitally" : "Digital reward"}
                        </span>
                      ) : status !== "delivered" ? (
                        <button
                          disabled={busyId === r.id}
                          onClick={() =>
                            updateStatus(
                              r.id,
                              status === "issued" ? "dispatched" : "delivered",
                              "Fulfilment updated.",
                            )
                          }
                          className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          {status === "issued" ? "Mark dispatched" : "Mark delivered"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No fulfilment records match.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
