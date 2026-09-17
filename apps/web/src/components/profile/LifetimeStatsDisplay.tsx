// =============================================================================
// Lifetime Stats Component
// Shows user's lifetime contribution totals across all channels.
// =============================================================================

import { useState, useEffect } from "react";
import { physicalApi, type LifetimeStats } from "@/services/physical.service";
import { TrendingUp, Globe, Smartphone, CreditCard, QrCode, Store } from "lucide-react";

const CHANNEL_META: Record<string, { icon: any; label: string; color: string }> = {
  web: { icon: Globe, label: "Web", color: "text-blue-600" },
  terminal: { icon: CreditCard, label: "Terminal", color: "text-purple-600" },
  qr: { icon: QrCode, label: "QR Code", color: "text-green-600" },
  in_store: { icon: Store, label: "In-Store", color: "text-amber-600" },
  vcard: { icon: Smartphone, label: "VCard", color: "text-teal-600" },
  mobile_app: { icon: Smartphone, label: "Mobile", color: "text-indigo-600" },
};

const HIERARCHY_META: Record<string, { label: string; color: string }> = {
  national: { label: "National", color: "bg-blue-100 text-blue-700" },
  city: { label: "City", color: "bg-green-100 text-green-700" },
  borough: { label: "Borough", color: "bg-purple-100 text-purple-700" },
  high_street: { label: "High Street", color: "bg-amber-100 text-amber-700" },
  business: { label: "Business", color: "bg-red-100 text-red-700" },
};

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

interface LifetimeStatsDisplayProps {
  userId: string;
}

export function LifetimeStatsDisplay({ userId }: LifetimeStatsDisplayProps) {
  const [stats, setStats] = useState<LifetimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    physicalApi.getLifetimeStats(userId).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalChannel = Object.values(stats.channelBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-bold text-gray-900">Lifetime Contributions</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-primary-50 p-4 text-center">
          <div className="text-2xl font-bold text-primary-700">{formatCurrency(stats.totalContributed)}</div>
          <div className="text-xs text-gray-600">Total Contributed</div>
        </div>
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.totalCampaignsBacked}</div>
          <div className="text-xs text-gray-600">Campaigns Backed</div>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.uniqueLocationsBacked}</div>
          <div className="text-xs text-gray-600">Locations Backed</div>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 mb-3">By Channel</h4>
        <div className="space-y-2">
          {Object.entries(stats.channelBreakdown)
            .filter(([_, amount]) => amount > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([channel, amount]) => {
              const meta = CHANNEL_META[channel];
              const Icon = meta?.icon || Globe;
              const percentage = totalChannel > 0 ? (amount / totalChannel) * 100 : 0;
              return (
                <div key={channel} className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${meta?.color || "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{meta?.label || channel}</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Hierarchy Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 mb-3">By Level</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.hierarchyBreakdown)
            .filter(([_, amount]) => amount > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([level, amount]) => {
              const meta = HIERARCHY_META[level];
              return (
                <div key={level} className={`rounded-lg px-3 py-1.5 ${meta?.color || "bg-gray-100 text-gray-700"}`}>
                  <span className="text-xs font-bold">{meta?.label || level}: {formatCurrency(amount)}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Community Backer Status */}
      {stats.isCommunityBacker && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏘️</span>
            <div>
              <div className="font-bold text-green-700">Community Backer</div>
              <div className="text-sm text-green-600">
                Recognized for in-store donations
                {stats.communityBackerAwardedAt && (
                  <span className="text-xs text-green-500 ml-2">
                    since {new Date(stats.communityBackerAwardedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
        <span>
          First contribution: {stats.firstContributionAt
            ? new Date(stats.firstContributionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            : "N/A"}
        </span>
        <span>
          Latest: {stats.lastContributionAt
            ? new Date(stats.lastContributionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            : "N/A"}
        </span>
      </div>
    </div>
  );
}
