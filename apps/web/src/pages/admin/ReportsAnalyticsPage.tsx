import { useEffect, useState, useMemo } from "react";
import { adminApi, type AdminCampaign, type AdminLocation, type AdminDashboardStats } from "@/services/admin";
import { formatCurrency, formatNumber } from "@/utils/formatters";

type Tab = "overview" | "campaigns" | "geography" | "users";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "geography", label: "Geography" },
  { id: "users", label: "Users" },
];

export function ReportsAnalyticsPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats().catch(() => null),
      adminApi.getCampaigns({ limit: 100 }).catch(() => ({ campaigns: [], total: 0 })),
      adminApi.getLocations({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
    ]).then(([s, cRes, lRes]) => {
      setStats(s);
      setCampaigns((cRes as any)?.campaigns || (cRes as any)?.items || []);
      setLocations((lRes as any)?.data || (lRes as any)?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    const successRate =
      stats.totalCampaigns > 0
        ? Math.round((stats.publishedCampaigns / stats.totalCampaigns) * 100)
        : 0;
    const avgDonation =
      stats.totalDonations > 0
        ? Math.round(stats.totalDonationsAmount / stats.totalDonations)
        : 0;
    return [
      { label: "Total Revenue", value: formatCurrency(stats.totalRaised || 0), icon: "💰", color: "bg-green-50 text-green-700" },
      { label: "Campaign Success Rate", value: `${successRate}%`, icon: "📈", color: "bg-blue-50 text-blue-700" },
      { label: "Avg Donation", value: formatCurrency(avgDonation), icon: "📊", color: "bg-amber-50 text-amber-700" },
      { label: "Total Backers", value: formatNumber(stats.totalDonations || 0), icon: "👥", color: "bg-purple-50 text-purple-700" },
    ];
  }, [stats]);

  // Category breakdown from live campaigns
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; raised: number }> = {};
    campaigns.forEach((c) => {
      const cat = c.category?.name || "General";
      if (!counts[cat]) counts[cat] = { count: 0, raised: 0 };
      counts[cat].count += 1;
      counts[cat].raised += c.raisedAmount || 0;
    });
    return Object.entries(counts).map(([name, data]) => ({ name, ...data }));
  }, [campaigns]);

  // Geographic breakdown from live locations
  const geoBreakdown = useMemo(() => {
    const regions: Record<string, { cities: number; raised: number }> = {};
    locations.forEach((loc) => {
      const region = loc.region || "United Kingdom";
      if (!regions[region]) regions[region] = { cities: 0, raised: 0 };
      regions[region].cities += 1;
      regions[region].raised += (loc as any).fundingRaised || 0;
    });
    return Object.entries(regions).map(([name, data]) => ({ name, ...data }));
  }, [locations]);

  // Top campaigns sorted by raised
  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))
      .slice(0, 5);
  }, [campaigns]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">
            {campaigns.length} campaigns across {locations.length} hub locations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{kpi.label}</span>
                  <span className="text-lg">{kpi.icon}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Campaigns */}
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Top Performing Campaigns</h2>
              {topCampaigns.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No campaigns available</p>
              ) : (
                <div className="space-y-3">
                  {topCampaigns.map((c) => {
                    const pct = c.goalAmount > 0 ? Math.round(((c.raisedAmount || 0) / c.goalAmount) * 100) : 0;
                    return (
                      <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.title}</p>
                          <p className="text-xs text-gray-400">{c.category?.name || "General"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(c.raisedAmount || 0)}</p>
                          <p className="text-xs text-primary-600">{pct}% funded</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No categories available</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.count} campaigns</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(cat.raised)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Campaigns */}
      {tab === "campaigns" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Campaign Performance Distribution</h2>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => {
                const total = campaigns.length || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <span className="text-gray-500">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Geography */}
      {tab === "geography" && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Regional Distribution</h2>
          <div className="space-y-3">
            {geoBreakdown.map((r) => (
              <div key={r.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.cities} active locations</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(r.raised)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {tab === "users" && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Platform User Composition</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <span className="text-xs text-gray-500">Total Users</span>
              <p className="mt-1 text-xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <span className="text-xs text-gray-500">Backers / Donors</span>
              <p className="mt-1 text-xl font-bold text-green-600">{stats?.totalDonations || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <span className="text-xs text-gray-500">Commercial Pledges</span>
              <p className="mt-1 text-xl font-bold text-blue-600">{stats?.totalPledges || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
