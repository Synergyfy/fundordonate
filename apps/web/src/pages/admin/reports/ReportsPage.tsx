import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Download, BarChart3, FileText } from "lucide-react";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";
import { adminApi, type AdminBusiness, type AdminCampaign, type AdminConsumer } from "@/services/admin";
import { formatCurrency, formatNumber } from "@/utils/formatters";

type ReportTab = "business" | "consumer" | "funding" | "campaigns" | "rewards";

const TABS: { id: ReportTab; label: string }[] = [
  { id: "business", label: "Business Reports" },
  { id: "consumer", label: "Consumer Reports" },
  { id: "funding", label: "Funding Reports" },
  { id: "campaigns", label: "Campaign Reports" },
  { id: "rewards", label: "Reward Reports" },
];

export function ReportsPage({ tab }: { tab: ReportTab }) {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [consumers, setConsumers] = useState<AdminConsumer[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getBusinesses({ limit: 50 }).catch(() => ({ items: [] })),
      adminApi.getCampaigns({ limit: 50 }).catch(() => ({ data: [] })),
      adminApi.getConsumers({ limit: 50 }).catch(() => ({ items: [] })),
      adminApi.getDashboardStats().catch(() => null),
    ]).then(([bizRes, campRes, consRes, statsRes]) => {
      setBusinesses((bizRes as any).items || (bizRes as any).businesses || (bizRes as any).data || []);
      setCampaigns((campRes as any).campaigns || (campRes as any).items || (campRes as any).data || []);
      setConsumers((consRes as any).items || (consRes as any).consumers || (consRes as any).data || []);
      setStats(statsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalBusinessContributed = businesses.reduce((acc, b) => acc + (b.totalContributed || 0), 0);
  const totalConsumerDonations = stats?.totalDonationsAmount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Reports</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Live aggregated performance metrics and platform breakdowns</p>
          </div>
          <button
            onClick={() => alert("Report exported.")}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/admin/reports/${t.id}`)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary-600 text-primary-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "business" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Active Businesses</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{businesses.length}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Business Contributions</span>
              <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(totalBusinessContributed)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Verified Businesses</span>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {businesses.filter((b) => b.verificationStatus === "VERIFIED").length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Commercial Participant Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium">Business</th>
                    <th className="px-5 py-3 text-left font-medium">City</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Contributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">Loading business report...</td>
                    </tr>
                  ) : businesses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">No registered businesses found.</td>
                    </tr>
                  ) : (
                    businesses.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.category || "General"}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-600">{b.city || "—"}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.verificationStatus === "VERIFIED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {b.verificationStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(b.totalContributed || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "consumer" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Registered Consumers</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{consumers.length}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Consumer Donations</span>
              <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(totalConsumerDonations)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "funding" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Total Funding Raised</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRaised || 0)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Donations Volume</span>
              <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(stats?.totalDonationsAmount || 0)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Pledges Volume</span>
              <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(stats?.totalPledgesAmount || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Campaign Performance ({campaigns.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium">Campaign</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Raised</th>
                    <th className="px-5 py-3 text-right font-medium">Goal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">{c.title}</td>
                      <td className="px-5 py-4 text-center">
                        <CampaignStatusBadge status={c.status as any} />
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(c.raisedAmount || 0)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-gray-500">
                        {formatCurrency(c.goalAmount || 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
