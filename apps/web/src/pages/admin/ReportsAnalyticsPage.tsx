import { useEffect, useState, useMemo } from "react";
import { adminApi } from "@/services/admin.service";
import { DEMO_CAMPAIGNS } from "@/data/demo";
import { ALL_LOCATIONS } from "@/data/ukHubData";

type Tab = "overview" | "campaigns" | "geography" | "users";

interface DashboardStats {
  totalCampaigns: number;
  publishedCampaigns: number;
  totalDonations: number;
  totalPledges: number;
  totalUsers: number;
  totalRaised: number;
  totalDonationsAmount: number;
  totalPledgesAmount: number;
}

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-GB").format(n);

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "geography", label: "Geography" },
  { id: "users", label: "Users" },
];

export function ReportsAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    adminApi
      .getDashboardStats()
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      { label: "Total Revenue", value: formatCurrency(stats.totalRaised), icon: "💰", color: "bg-green-50 text-green-700" },
      { label: "Campaign Success Rate", value: `${successRate}%`, icon: "📈", color: "bg-blue-50 text-blue-700" },
      { label: "Avg Donation", value: formatCurrency(avgDonation), icon: "📊", color: "bg-amber-50 text-amber-700" },
      { label: "Total Users", value: formatNumber(stats.totalUsers), icon: "👥", color: "bg-purple-50 text-purple-700" },
      { label: "Active Campaigns", value: formatNumber(stats.publishedCampaigns), icon: "🎯", color: "bg-teal-50 text-teal-700" },
      { label: "Conversion Rate", value: `${successRate > 0 ? Math.round((stats.totalDonations / stats.totalUsers) * 100) : 0}%`, icon: "🔄", color: "bg-pink-50 text-pink-700" },
    ];
  }, [stats]);

  const modeData = useMemo(() => {
    const modes = { donation: 0, fund: 0, sponsor: 0 };
    DEMO_CAMPAIGNS.forEach((c) => {
      const m = c.mode as keyof typeof modes;
      if (m in modes) modes[m]++;
    });
    return modes;
  }, []);

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    DEMO_CAMPAIGNS.forEach((c) => {
      if (c.location) counts[c.location] = (counts[c.location] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, []);

  const topCampaigns = useMemo(() => {
    return [...DEMO_CAMPAIGNS]
      .sort((a, b) => b.raisedAmount - a.raisedAmount)
      .slice(0, 10);
  }, []);

  const roleData = useMemo(() => {
    const roles: Record<string, number> = { admin: 1, fundraiser: 2, backer: 5, donor: 12, collaborator: 1 };
    return Object.entries(roles).sort((a, b) => b[1] - a[1]);
  }, []);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    DEMO_CAMPAIGNS.forEach((c) => {
      const name = c.category?.name || "Uncategorized";
      cats[name] = (cats[name] || 0) + 1;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, []);

  const maxVal = (arr: [string, number][]) => Math.max(...arr.map(([, v]) => v), 1);

  const handleExport = () => {
    const rows = [["Title", "Mode", "Goal", "Raised", "Location", "Category"]];
    DEMO_CAMPAIGNS.forEach((c) => {
      rows.push([c.title, c.mode, String(c.goalAmount), String(c.raisedAmount), c.location || "", c.category?.name || ""]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fundordonate-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">{DEMO_CAMPAIGNS.length} campaigns across {ALL_LOCATIONS.length} locations</p>
        </div>
        <button onClick={handleExport} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xl">{k.icon}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${k.color}`}>{k.value}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Top Campaigns */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by Revenue</h2>
            <div className="space-y-3">
              {topCampaigns.map((c) => {
                const pct = c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0;
                return (
                  <div key={c.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                      <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>{formatCurrency(c.raisedAmount)} raised</span>
                      <span>{formatCurrency(c.goalAmount)} goal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Mode Breakdown */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaigns by Mode</h2>
            <div className="space-y-4">
              {Object.entries(modeData).map(([mode, count]) => {
                const total = DEMO_CAMPAIGNS.length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={mode}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 font-medium">{mode}</span>
                      <span className="text-gray-500">{count} campaigns ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${mode === "donation" ? "bg-green-500" : mode === "fund" ? "bg-blue-500" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaigns by Category</h2>
            <div className="space-y-3">
              {categoryData.map(([cat, count]) => {
                const max = maxVal(categoryData);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 truncate">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "geography" && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaigns by City</h2>
          <div className="space-y-3">
            {cityData.map(([city, count]) => {
              const max = maxVal(cityData);
              return (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40 truncate">{city}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-teal-500" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
            {cityData.length === 0 && (
              <p className="text-sm text-gray-400">No geographic data available.</p>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Role Distribution */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>
            <div className="space-y-3">
              {roleData.map(([role, count]) => {
                const max = maxVal(roleData);
                return (
                  <div key={role} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32 capitalize">{role}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-purple-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Registered</span><span className="font-medium text-gray-800">{stats?.totalUsers || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Active Backers</span><span className="font-medium text-gray-800">{roleData.find(([r]) => r === "backer")?.[1] || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Donations</span><span className="font-medium text-gray-800">{stats?.totalDonations || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Pledges</span><span className="font-medium text-gray-800">{stats?.totalPledges || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg Contribution</span><span className="font-medium text-gray-800">{stats && stats.totalDonations > 0 ? formatCurrency(Math.round(stats.totalRaised / stats.totalDonations)) : "£0"}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
