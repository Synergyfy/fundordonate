import { useEffect, useState } from "react";
import { userDashboardApi } from "@/services/user-dashboard.service";

interface ReceiptData {
  year: number;
  donations: { uid: string; amount: number; campaign: { title: string }; createdAt: string }[];
  pledges: { uid: string; amount: number; campaign: { title: string }; reward: { title: string } | null; createdAt: string }[];
  totalDonations: number;
  totalPledges: number;
  totalContributed: number;
}

const formatCurrency = (a: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);
const formatDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

export function ReceiptsPage() {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const d = await userDashboardApi.getReceipts(year);
      setData(d);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [year]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Annual Receipts</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-32">
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-400">Total Donations ({year})</p>
              <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(data.totalDonations)}</p>
              <p className="text-xs text-gray-400">{data.donations.length} donations</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-400">Total Pledges ({year})</p>
              <p className="mt-1 text-xl font-bold text-blue-700">{formatCurrency(data.totalPledges)}</p>
              <p className="text-xs text-gray-400">{data.pledges.length} pledges</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-400">Total Contributed ({year})</p>
              <p className="mt-1 text-xl font-bold text-primary-700">{formatCurrency(data.totalContributed)}</p>
            </div>
          </div>

          {/* Donations */}
          {data.donations.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Donations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Campaign</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Amount</th>
                      <th className="px-3 py-2 font-medium text-gray-500">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.donations.map((d) => (
                      <tr key={d.uid}>
                        <td className="px-3 py-2 text-gray-600">{formatDate(d.createdAt)}</td>
                        <td className="px-3 py-2 text-gray-800">{d.campaign.title}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(d.amount)}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-400">{d.uid.slice(0, 8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pledges */}
          {data.pledges.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pledges</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Campaign</th>
                      <th className="px-3 py-2 font-medium text-gray-500 hidden sm:table-cell">Reward</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.pledges.map((p) => (
                      <tr key={p.uid}>
                        <td className="px-3 py-2 text-gray-600">{formatDate(p.createdAt)}</td>
                        <td className="px-3 py-2 text-gray-800">{p.campaign.title}</td>
                        <td className="px-3 py-2 hidden sm:table-cell text-gray-500">{p.reward?.title || "—"}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
