// =============================================================================
// Business Owner Contributions Page
// Track in-store and online contributions.
// =============================================================================

import { useState } from "react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_CONTRIBUTIONS = [
  { id: "txn-1", campaign: "Feed Manchester", type: "IN_STORE", amount: 5000, date: "2026-09-01", reference: "POS-001" },
  { id: "txn-2", campaign: "Feed Manchester", type: "ONLINE", amount: 2500, date: "2026-08-30", reference: "WEB-042" },
  { id: "txn-3", campaign: "Youth Bakery Training", type: "IN_STORE", amount: 3000, date: "2026-08-28", reference: "POS-002" },
  { id: "txn-4", campaign: "Feed Manchester", type: "ONLINE", amount: 1500, date: "2026-08-25", reference: "WEB-038" },
  { id: "txn-5", campaign: "Youth Bakery Training", type: "IN_STORE", amount: 4000, date: "2026-08-22", reference: "POS-003" },
  { id: "txn-6", campaign: "Feed Manchester", type: "FUNDING_SPLIT", amount: 2000, date: "2026-08-20", reference: "SPLIT-012" },
  { id: "txn-7", campaign: "Youth Bakery Training", type: "ONLINE", amount: 1000, date: "2026-08-18", reference: "WEB-035" },
];

type TypeFilter = "" | "IN_STORE" | "ONLINE" | "FUNDING_SPLIT";

export default function BusinessOwnerContributionsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const filtered = typeFilter ? DEMO_CONTRIBUTIONS.filter((c) => c.type === typeFilter) : DEMO_CONTRIBUTIONS;
  const totalAmount = filtered.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
        <p className="text-sm text-gray-500">Track all in-store and online contributions to your campaigns.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 p-5 text-white">
        <div className="text-sm text-green-100">Total Contributions ({filtered.length} transactions)</div>
        <div className="text-3xl font-bold mt-1">{fmt(totalAmount)}</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["", "IN_STORE", "ONLINE", "FUNDING_SPLIT"] as TypeFilter[]).map((t) => (
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
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
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.campaign}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.type === "IN_STORE" ? "bg-blue-100 text-blue-700" :
                    c.type === "ONLINE" ? "bg-green-100 text-green-700" :
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
      </div>
    </div>
  );
}
