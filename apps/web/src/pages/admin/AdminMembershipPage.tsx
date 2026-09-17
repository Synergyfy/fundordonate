// =============================================================================
// Admin Membership Page
// Membership plan management: tiers, levels, pricing, subscribers, revenue.
// =============================================================================

import { useState } from "react";
import {
  Crown, Gem, DollarSign, Users, TrendingUp,
  Edit3, Plus,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

interface MembershipTier {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  levels: MembershipLevel[];
}

interface MembershipLevel {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration: string;
  subscribers: number;
  revenue: number;
}

const DEMO_TIERS: MembershipTier[] = [
  {
    id: "bronze", name: "Bronze", slug: "bronze", color: "text-amber-600", icon: "🥉",
    levels: [
      { id: "bronze-standard", name: "Standard", slug: "standard", price: 5000, duration: "Seasonal (180 days)", subscribers: 245, revenue: 1225000 },
      { id: "bronze-pro", name: "Pro", slug: "pro", price: 10000, duration: "Seasonal (180 days)", subscribers: 89, revenue: 890000 },
      { id: "bronze-pro-plus", name: "Pro+", slug: "pro-plus", price: 20000, duration: "Annual (365 days)", subscribers: 32, revenue: 640000 },
    ],
  },
  {
    id: "silver", name: "Silver", slug: "silver", color: "text-gray-500", icon: "🥈",
    levels: [
      { id: "silver-standard", name: "Standard", slug: "standard", price: 10000, duration: "Seasonal (180 days)", subscribers: 178, revenue: 1780000 },
      { id: "silver-pro", name: "Pro", slug: "pro", price: 20000, duration: "Seasonal (180 days)", subscribers: 65, revenue: 1300000 },
      { id: "silver-pro-plus", name: "Pro+", slug: "pro-plus", price: 40000, duration: "Annual (365 days)", subscribers: 28, revenue: 1120000 },
    ],
  },
  {
    id: "gold", name: "Gold", slug: "gold", color: "text-yellow-600", icon: "🥇",
    levels: [
      { id: "gold-standard", name: "Standard", slug: "standard", price: 25000, duration: "Seasonal (180 days)", subscribers: 120, revenue: 3000000 },
      { id: "gold-pro", name: "Pro", slug: "pro", price: 50000, duration: "Seasonal (180 days)", subscribers: 42, revenue: 2100000 },
      { id: "gold-pro-plus", name: "Pro+", slug: "pro-plus", price: 100000, duration: "Annual (365 days)", subscribers: 15, revenue: 1500000 },
    ],
  },
  {
    id: "platinum", name: "Platinum", slug: "platinum", color: "text-purple-600", icon: "💎",
    levels: [
      { id: "platinum-standard", name: "Standard", slug: "standard", price: 50000, duration: "Seasonal (180 days)", subscribers: 65, revenue: 3250000 },
      { id: "platinum-pro", name: "Pro", slug: "pro", price: 100000, duration: "Seasonal (180 days)", subscribers: 22, revenue: 2200000 },
      { id: "platinum-pro-plus", name: "Pro+", slug: "pro-plus", price: 200000, duration: "Annual (365 days)", subscribers: 8, revenue: 1600000 },
    ],
  },
];

export default function AdminMembershipPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const totalSubscribers = DEMO_TIERS.flatMap((t) => t.levels).reduce((s, l) => s + l.subscribers, 0);
  const totalRevenue = DEMO_TIERS.flatMap((t) => t.levels).reduce((s, l) => s + l.revenue, 0);
  const tierTotals = DEMO_TIERS.map((t) => ({
    ...t,
    totalSubscribers: t.levels.reduce((s, l) => s + l.subscribers, 0),
    totalRevenue: t.levels.reduce((s, l) => s + l.revenue, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-sm text-gray-500">Manage membership tiers, levels, pricing and subscribers.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Add Tier
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
          <Crown className="mx-auto h-5 w-5 text-amber-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{DEMO_TIERS.length}</div>
          <div className="text-xs text-gray-500">Tiers</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
          <Users className="mx-auto h-5 w-5 text-blue-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{totalSubscribers.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Subscribers</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
          <DollarSign className="mx-auto h-5 w-5 text-green-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">{fmt(totalRevenue)}</div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-purple-500 mb-1" />
          <div className="text-lg font-bold text-gray-900">3</div>
          <div className="text-xs text-gray-500">Levels per Tier</div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tierTotals.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(isSelected ? null : tier.id)}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                isSelected ? "border-primary-300 bg-primary-50 shadow-md" : "border-gray-200 bg-white hover:shadow-sm"
              }`}
            >
              <div className="text-2xl mb-2">{tier.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Subscribers</span>
                  <span className="font-bold text-gray-900">{tier.totalSubscribers}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-bold text-gray-900">{fmt(tier.totalRevenue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Details */}
      {selectedTier && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              {DEMO_TIERS.find((t) => t.id === selectedTier)?.name} Levels
            </h3>
            <button className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              <Edit3 className="h-3 w-3" /> Edit Tier
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Level</th>
                <th className="px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Duration</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Subscribers</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {DEMO_TIERS.find((t) => t.id === selectedTier)?.levels.map((level) => (
                <tr key={level.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{level.name}</span>
                      {level.slug === "pro-plus" && <Gem className="h-3 w-3 text-purple-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(level.price)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">{level.duration}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-900">{level.subscribers}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">{fmt(level.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pro+ Annual Note */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Gem className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900">Pro+ is Annual Access</h4>
            <p className="text-xs text-blue-700 mt-1">
              Pro+ memberships are annual (365 days), not seasonal (180 days). This provides longer access and higher value for committed members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
