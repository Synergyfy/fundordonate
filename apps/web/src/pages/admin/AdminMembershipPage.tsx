// =============================================================================
// Admin Membership Page
// Membership plan management: tiers, levels, pricing, subscribers, revenue.
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { MEMBERSHIP_TIERS } from "@/constants/membershipTiers";
import {
  Crown, Users, TrendingUp,
  Loader2,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

/** Base ("Standard") contribution in pence, sourced from the canonical tier catalogue. */
function standardPricePence(tierId: string): number {
  const tier = MEMBERSHIP_TIERS.find((t) => t.id === tierId);
  const variant = tier?.variants.find((v) => v.accessLevel === "standard");
  return (variant?.price ?? 0) * 100;
}

export default function AdminMembershipPage() {
  const { data: businessesData, isLoading: loadingBiz } = useQuery({
    queryKey: ["admin-businesses-tiers"],
    queryFn: () => adminApi.getBusinesses({ limit: 100 }),
  });

  const { data: foundingMembers, isLoading: loadingFounding } = useQuery({
    queryKey: ["admin-founding-tiers"],
    queryFn: () => adminApi.getFoundingMembers(),
  });

  const businesses = businessesData?.items || businessesData?.businesses || [];

  const tierStats = {
    BRONZE: businesses.filter((b: any) => b.membershipTier === "BRONZE").length,
    SILVER: businesses.filter((b: any) => b.membershipTier === "SILVER").length,
    GOLD: businesses.filter((b: any) => b.membershipTier === "GOLD").length,
    PLATINUM: businesses.filter((b: any) => b.membershipTier === "PLATINUM").length,
  };

  const tiers = [
    {
      id: "bronze",
      name: "Bronze",
      badge: "BRONZE",
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      icon: "🥉",
      activeCount: tierStats.BRONZE,
      standardPrice: standardPricePence("bronze"),
    },
    {
      id: "silver",
      name: "Silver",
      badge: "SILVER",
      color: "text-gray-500",
      bg: "bg-gray-50 border-gray-200",
      icon: "🥈",
      activeCount: tierStats.SILVER,
      standardPrice: standardPricePence("silver"),
    },
    {
      id: "gold",
      name: "Gold",
      badge: "GOLD",
      color: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      icon: "🥇",
      activeCount: tierStats.GOLD,
      standardPrice: standardPricePence("gold"),
    },
    {
      id: "platinum",
      name: "Platinum",
      badge: "PLATINUM",
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
      icon: "💎",
      activeCount: tierStats.PLATINUM,
      standardPrice: standardPricePence("platinum"),
    },
  ];

  const totalSubscribers = businessesData?.total ?? businesses.length;
  const totalFounding = foundingMembers?.length || 0;

  if (loadingBiz || loadingFounding) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
        <p className="text-sm text-gray-500">Live overview of business membership tiers, subscribers, and pricing.</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Users className="h-4 w-4 text-blue-500" /> Total Active Businesses
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalSubscribers}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Crown className="h-4 w-4 text-amber-500" /> Founding Members
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalFounding}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" /> Available Tiers
          </div>
          <div className="text-2xl font-bold text-gray-900">{tiers.length}</div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div key={t.id} className={`rounded-xl border p-5 bg-white shadow-sm flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{t.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.bg} ${t.color}`}>
                  {t.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name} Tier</h3>
              <p className="text-xs text-gray-500 mb-4">Base contribution {fmt(t.standardPrice)}</p>
            </div>
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500">Active Subscribers</div>
              <div className="text-xl font-bold text-gray-900">{t.activeCount} businesses</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
