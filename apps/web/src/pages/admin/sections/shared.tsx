// =============================================================================
// Shared admin section primitives
// =============================================================================

import type { ReactNode } from "react";
import { Loader2, AlertCircle, RotateCcw, Inbox } from "lucide-react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function AdminLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
        {label}
      </div>
    </div>
  );
}

export function AdminError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
      <h3 className="mb-1 font-semibold text-gray-900">Something went wrong</h3>
      <p className="mb-4 text-sm text-gray-600">This section could not be loaded.</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  resolved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  open: "bg-amber-100 text-amber-700",
  "in_progress": "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-700",
};

export function StatusPill({ status }: { status: string }) {
  const key = status?.toLowerCase();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[key] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export const fmtGbp = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    (pence || 0) / 100,
  );

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
