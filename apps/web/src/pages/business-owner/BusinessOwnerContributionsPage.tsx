// =============================================================================
// Business Owner Contributions Page
// Track in-store and online contributions, wired to live backend API.
// =============================================================================

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useContributions } from "@/services/contribution/hook";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type TypeFilter = "" | "IN_STORE" | "ONLINE" | "FUNDING_SPLIT" | "SELF_FUNDING";

export default function BusinessOwnerContributionsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const { data, isLoading, error, refetch } = useContributions(
    typeFilter ? { type: typeFilter } : undefined
  );

  const contributions = data?.items || [];
  const totalAmount = data?.summary.totalAmount || 0;
  const transactionCount = data?.summary.transactionCount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
        <p className="text-sm text-gray-500">Track all in-store, online, and split contributions to your campaigns.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 p-5 text-white shadow-sm">
        <div className="text-sm text-green-100">Total Contributions ({transactionCount} transactions)</div>
        <div className="text-3xl font-bold mt-1">{fmt(totalAmount)}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["", "IN_STORE", "ONLINE", "FUNDING_SPLIT", "SELF_FUNDING"] as TypeFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === t ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t ? t.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-xl bg-white p-6 shadow-sm border animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <p className="font-semibold text-red-900">Failed to load contributions ledger.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
          {contributions.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No contributions found {typeFilter ? `for channel "${typeFilter}"` : "yet"}.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Reference</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.campaign}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.type === "IN_STORE" ? "bg-blue-100 text-blue-700" :
                        c.type === "ONLINE" ? "bg-green-100 text-green-700" :
                        c.type === "SELF_FUNDING" ? "bg-amber-100 text-amber-800" :
                        "bg-purple-100 text-purple-700"
                      }`}>{c.type.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.amount)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500 font-mono">{c.reference}</td>
                    <td className="px-4 py-3 text-gray-500">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
