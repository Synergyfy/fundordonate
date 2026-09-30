import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, PackageCheck, Truck, Clock, Gift, Search, CheckCircle2 } from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type FulfilmentStatus = "issued" | "dispatched" | "delivered" | "failed";

interface FulfilmentRow {
  id: string;
  reward: string;
  recipient: string;
  business: string;
  campaign: string;
  type: "e-gift" | "voucher" | "merch" | "experience";
  value: number; // pence
  status: FulfilmentStatus;
  issuedAt: string;
}

const SEED: FulfilmentRow[] = [
  { id: "FF-2201", reward: "£5 E-Gift Card", recipient: "Sarah Chen", business: "Sarah's Bakery", campaign: "London Community Garden", type: "e-gift", value: 500, status: "delivered", issuedAt: "2026-09-26" },
  { id: "FF-2200", reward: "Free Coffee Voucher", recipient: "James Wilson", business: "Northern Brew Co", campaign: "Manchester Tech Hub Launch", type: "voucher", value: 350, status: "dispatched", issuedAt: "2026-09-26" },
  { id: "FF-2199", reward: "£10 E-Gift Card", recipient: "Amelia Foster", business: "Green Grocer Ltd", campaign: "Birmingham Food Bank Network", type: "e-gift", value: 1000, status: "issued", issuedAt: "2026-09-25" },
  { id: "FF-2198", reward: "Event Ticket", recipient: "Noah Patel", business: "City Arts Trust", campaign: "Bristol Arts Centre", type: "experience", value: 2500, status: "issued", issuedAt: "2026-09-25" },
  { id: "FF-2197", reward: "Branded Tote Bag", recipient: "Grace Okoro", business: "Campus Tech Store", campaign: "Leeds Digital Skills Programme", type: "merch", value: 1200, status: "failed", issuedAt: "2026-09-24" },
  { id: "FF-2196", reward: "£5 E-Gift Card", recipient: "Oliver Smith", business: "Sarah's Bakery", campaign: "Manchester Tech Hub Launch", type: "e-gift", value: 500, status: "delivered", issuedAt: "2026-09-23" },
  { id: "FF-2195", reward: "Free Coffee Voucher", recipient: "Ava Thompson", business: "Northern Brew Co", campaign: "Bristol Arts Centre", type: "voucher", value: 350, status: "dispatched", issuedAt: "2026-09-22" },
];

const STATUS_STYLES: Record<FulfilmentStatus, string> = {
  issued: "bg-yellow-100 text-yellow-700",
  dispatched: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const FILTERS: { id: "all" | FulfilmentStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "issued", label: "Issued" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
  { id: "failed", label: "Failed" },
];

export function FulfilmentPage() {
  const [rows, setRows] = useState<FulfilmentRow[]>(SEED);
  const [filter, setFilter] = useState<"all" | FulfilmentStatus>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (search && !`${r.reward} ${r.recipient} ${r.business} ${r.campaign} ${r.id}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [rows, filter, search]
  );

  const counts = useMemo(
    () => ({
      issued: rows.filter((r) => r.status === "issued").length,
      dispatched: rows.filter((r) => r.status === "dispatched").length,
      delivered: rows.filter((r) => r.status === "delivered").length,
      failed: rows.filter((r) => r.status === "failed").length,
      value: rows.filter((r) => r.status !== "failed").reduce((s, r) => s + r.value, 0),
    }),
    [rows]
  );

  const advance = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next: FulfilmentStatus =
            r.status === "issued" ? "dispatched" : r.status === "dispatched" ? "delivered" : r.status;
          return { ...r, status: next };
        })
      );
      setBusyId(null);
      setToast("Fulfilment updated.");
      setTimeout(() => setToast(null), 2400);
    }, 300);
  };

  const retry = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "issued" } : r)));
      setBusyId(null);
      setToast("Reward re-issued.");
      setTimeout(() => setToast(null), 2400);
    }, 300);
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
          <Link to="/admin/rewards" className="hover:text-gray-700">Rewards</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-900">Fulfilment</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reward Fulfilment</h1>
        <p className="text-sm text-gray-500">Track issued rewards through dispatch and delivery.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Clock className="h-3.5 w-3.5" /> Issued</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.issued}</div>
          <div className="text-xs text-gray-400">Awaiting dispatch</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Truck className="h-3.5 w-3.5" /> Dispatched</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.dispatched}</div>
          <div className="text-xs text-gray-400">In transit / sent</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><PackageCheck className="h-3.5 w-3.5" /> Delivered</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{counts.delivered}</div>
          <div className="text-xs text-gray-400">{counts.failed} failed</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Gift className="h-3.5 w-3.5" /> Reward value</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{fmt(counts.value)}</div>
          <div className="text-xs text-gray-400">Issued this period</div>
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Reward</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.reward}</td>
                <td className="px-4 py-3 text-gray-500">{r.recipient}</td>
                <td className="px-4 py-3 text-gray-500">{r.business}</td>
                <td className="px-4 py-3 text-gray-500">{r.campaign}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(r.value)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.issuedAt}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "failed" ? (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => retry(r.id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Re-issue
                    </button>
                  ) : r.status !== "delivered" ? (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => advance(r.id)}
                      className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                    >
                      {r.status === "issued" ? "Mark dispatched" : "Mark delivered"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Complete</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">No fulfilment records match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
