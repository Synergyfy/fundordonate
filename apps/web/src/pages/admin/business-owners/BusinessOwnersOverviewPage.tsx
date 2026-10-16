// =============================================================================
// Business Owners Overview — Admin
// Business Owner activity command view with live database metrics and drill-down.
// =============================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Building2, Users, TrendingUp, Target, Trophy, Wallet, Star } from "lucide-react";
import { adminApi, type AdminDashboardStats, type ActivityFeedItem } from "@/services/admin";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p || 0) / 100);

export function BusinessOwnersOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [statsRes, topRes, activityRes] = await Promise.allSettled([
          adminApi.getDashboardStats(),
          adminApi.getTopCampaigns(5),
          adminApi.getActivityFeed(6),
        ]);

        if (!mounted) return;

        if (statsRes.status === "fulfilled" && statsRes.value) {
          setStats(statsRes.value);
        }
        if (topRes.status === "fulfilled" && topRes.value) {
          setTopCampaigns(topRes.value || []);
        }
        if (activityRes.status === "fulfilled" && activityRes.value) {
          setActivityFeed(activityRes.value || []);
        }
      } catch (err) {
        console.error("Failed to load business owners overview data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalRaised = stats?.totalRevenue || 0;
  const activeCampaigns = stats?.activeCampaigns || 0;
  const totalBusinesses = stats?.totalBusinesses || 0;
  const totalBackers = stats?.totalBackers || 0;
  const targetAmount = 50000000; // Seasonal target benchmark in pence
  const progressPct = targetAmount > 0 ? Math.min(100, Math.round((totalRaised / targetAmount) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Business Owners</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Business Owners</h1>
        <p className="text-sm text-gray-500">Business Owner activity overview across the platform</p>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-400">
          Loading platform metrics from database...
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Raised", value: fmt(totalRaised), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
              { label: "Active Campaigns", value: String(activeCampaigns), icon: <Target className="h-4 w-4 text-blue-500" /> },
              { label: "Total Backers", value: totalBackers.toLocaleString(), icon: <Users className="h-4 w-4 text-purple-500" /> },
              { label: "Registered Businesses", value: totalBusinesses.toLocaleString(), icon: <Building2 className="h-4 w-4 text-amber-500" /> },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white border p-4 flex items-center gap-3">
                {item.icon}
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="text-lg font-bold text-gray-900">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="rounded-xl bg-white border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Platform Campaign Funding Progress</h3>
              <span className="text-sm font-bold text-primary-600">
                {progressPct}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{fmt(totalRaised)} raised</span>
              <span>{fmt(targetAmount)} seasonal benchmark</span>
            </div>
          </div>

          {/* Participation Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border p-4 text-center">
              <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{totalBackers.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Total Backers</div>
            </div>
            <div className="rounded-xl bg-white border p-4 text-center">
              <Trophy className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{activeCampaigns.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Active Campaigns</div>
            </div>
            <div className="rounded-xl bg-white border p-4 text-center">
              <Wallet className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{totalBusinesses.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Participating Businesses</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns */}
            <div className="rounded-xl bg-white border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Top Campaigns</h3>
                <Link to="/admin/business-owners/campaigns" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {topCampaigns.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">No active campaigns available.</div>
                ) : (
                  topCampaigns.map((c) => {
                    const target = c.targetAmount || c.target || 0;
                    const raised = c.raisedAmount || c.raised || 0;
                    const progress = target > 0 ? Math.round((raised / target) * 100) : 0;
                    return (
                      <div key={c.id} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{c.title || c.name}</span>
                          <span className="text-xs font-bold text-primary-600">{progress}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{fmt(raised)} of {fmt(target)}</span>
                          <span>{c.backerCount || c.backers || 0} backers</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, progress)}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl bg-white border">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {activityFeed.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">No recent activity events recorded.</div>
                ) : (
                  activityFeed.map((a, i) => (
                    <div key={a.id || i} className="px-5 py-3 flex items-start gap-3">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Recent"}
                      </span>
                      <span className="text-sm text-gray-700">{a.action || a.entityType || "System Event"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
