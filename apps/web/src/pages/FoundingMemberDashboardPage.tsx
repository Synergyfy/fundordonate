// =============================================================================
// Founding Member Dashboard Page
// Business owner's founding member view: memberships, benefits, leaderboard.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { foundingApi, type FoundingMembership } from "@/services/founding.service";
import { FoundingMemberBadge, getFoundingBadgeType } from "@/components/hub/FoundingMemberBadge";
import {
  ArrowRight, Calendar, Star, Users, Trophy, Gift,
  CheckCircle2, Clock, CreditCard, Crown,
} from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const DEMO_MEMBERSHIPS: FoundingMembership[] = [
  {
    id: "fm-1", userId: "user-1", programmeId: "prog-1", locationId: "manchester", locationName: "Manchester",
    audience: "BUSINESS", status: "ACTIVE", contributionAmount: 10000, isOriginal: true, isMonthly: false,
    grantedAt: "2026-06-01T10:00:00Z", expiresAt: "2026-11-30T23:59:59Z",
    benefits: ["Early Access", "Voting Rights", "Priority Participation", "Founding Recognition"],
  },
  {
    id: "fm-2", userId: "user-1", programmeId: "prog-2", locationId: "london", locationName: "London",
    audience: "BUSINESS", status: "ACTIVE", contributionAmount: 5000, isOriginal: false, isMonthly: true,
    grantedAt: "2026-08-15T10:00:00Z",
    benefits: ["Early Access", "Priority Participation"],
  },
];

const DEMO_BENEFITS = [
  { icon: Star, title: "Early Access", desc: "Access new features before public launch", active: true },
  { icon: Users, title: "Voting Rights", desc: "Vote on hub decisions and campaign priorities", active: true },
  { icon: Trophy, title: "Priority Participation", desc: "First in line for new campaigns and opportunities", active: true },
  { icon: Crown, title: "Founding Recognition", desc: "Displayed as Founding Business Member", active: true },
  { icon: Gift, title: "Exclusive Events", desc: "Invitation to business networking events", active: true },
  { icon: CreditCard, title: "Monthly Billing", desc: "Convenient monthly contribution", active: false },
];

const DEMO_LEADERBOARD = [
  { position: 1, name: "Tech Hub Manchester", amount: 25000, isOriginal: true, monthly: false },
  { position: 2, name: "You", amount: 15000, isOriginal: true, monthly: false },
  { position: 3, name: "Green Valley Cafe", amount: 12000, isOriginal: false, monthly: true },
  { position: 4, name: "Manchester Books", amount: 8000, isOriginal: false, monthly: false },
  { position: 5, name: "Urban Bites", amount: 5000, isOriginal: true, monthly: false },
];

export default function FoundingMemberDashboardPage() {
  const [activeTab, setActiveTab] = useState<"memberships" | "benefits" | "leaderboard">("memberships");

  const { data: memberships } = useQuery({
    queryKey: ["founding-memberships"],
    queryFn: () => foundingApi.getMyMemberships(),
    placeholderData: DEMO_MEMBERSHIPS,
  });

  const activeMemberships = memberships?.filter((m) => m.status === "ACTIVE") || [];
  const myLeaderboardPos = DEMO_LEADERBOARD.findIndex((e) => e.name === "You") + 1;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Founding Member Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your founding memberships, benefits, and status.</p>
        </div>
        <Link to="/uk-hub-activation/business" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Join New Programme <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Active Memberships</div>
          <div className="text-lg font-bold text-gray-900">{activeMemberships.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Total Contributed</div>
          <div className="text-lg font-bold text-gray-900">{fmt(memberships?.reduce((s, m) => s + m.contributionAmount, 0) || 0)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Leaderboard</div>
          <div className="text-lg font-bold text-gray-900">{myLeaderboardPos > 0 ? `#${myLeaderboardPos}` : "N/A"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-400 mb-1">Original Founder</div>
          <div className="text-lg font-bold text-gray-900">{activeMemberships.some((m) => m.isOriginal) ? "Yes" : "No"}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["memberships", "benefits", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "memberships" && (
        <div className="space-y-4">
          {memberships?.map((m) => {
            const badgeType = getFoundingBadgeType(m.audience, m.isOriginal, m.isMonthly);
            return (
              <div key={m.id} className="rounded-xl border bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <FoundingMemberBadge type={badgeType} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{m.locationName} Founding Member</h3>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {m.status}
                        </span>
                        {m.isOriginal && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            Original
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{fmt(m.contributionAmount)} {m.isMonthly ? "/ month" : "one-time"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Granted {new Date(m.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {m.expiresAt && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Expires {new Date(m.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.benefits.map((b) => (
                          <span key={b} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            <CheckCircle2 className="h-2.5 w-2.5" />{b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link to={`/founding/${m.programmeId}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
                    View Programme →
                  </Link>
                </div>
              </div>
            );
          })}
          {memberships?.length === 0 && (
            <div className="rounded-xl border bg-white p-8 text-center">
              <Crown className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">No founding memberships yet</p>
              <p className="text-xs text-gray-400 mt-1">Join a founding programme to get started.</p>
              <Link to="/uk-hub-activation/business" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Explore Programmes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_BENEFITS.map((b) => (
            <div key={b.title} className={`rounded-xl border p-5 ${b.active ? "bg-white" : "bg-gray-50 opacity-50"}`}>
              <b.icon className={`h-6 w-6 mb-3 ${b.active ? "text-primary-500" : "text-gray-300"}`} />
              <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
              {b.active && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-green-600"><CheckCircle2 className="h-3 w-3" />Active</span>}
            </div>
          ))}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Founding Member Leaderboard</h3>
          </div>
          <div className="divide-y">
            {DEMO_LEADERBOARD.map((entry) => (
              <div key={entry.position} className={`flex items-center justify-between px-4 py-3 ${entry.name === "You" ? "bg-primary-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    entry.position <= 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    #{entry.position}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {entry.isOriginal && "Original Founder · "}
                      {entry.monthly ? "Monthly" : "One-time"}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">{fmt(entry.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
