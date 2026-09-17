// =============================================================================
// Admin Founding Members Page
// Directory of all founding members with filters for audience, status, programme.
// =============================================================================

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { foundingApi, type FoundingMembership } from "@/services/founding.service";
import { FoundingMemberBadge, getFoundingBadgeType } from "@/components/hub/FoundingMemberBadge";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type AudienceFilter = "" | "BUSINESS" | "CONSUMER";
type StatusFilter = "" | "ACTIVE" | "EXPIRED" | "REVOKED";

const DEMO_FOUNDING_MEMBERS: FoundingMembership[] = [
  { id: "fm-1", userId: "u1", programmeId: "p1", locationId: "manchester", locationName: "Manchester", audience: "BUSINESS", status: "ACTIVE", contributionAmount: 10000, isOriginal: true, isMonthly: false, grantedAt: "2026-06-01T10:00:00Z", expiresAt: "2026-11-30T23:59:59Z", benefits: ["Early Access", "Voting Rights"] },
  { id: "fm-2", userId: "u2", programmeId: "p1", locationId: "manchester", locationName: "Manchester", audience: "BUSINESS", status: "ACTIVE", contributionAmount: 5000, isOriginal: false, isMonthly: true, grantedAt: "2026-08-15T10:00:00Z", benefits: ["Early Access"] },
  { id: "fm-3", userId: "u3", programmeId: "p2", locationId: "london", locationName: "London", audience: "CONSUMER", status: "ACTIVE", contributionAmount: 2500, isOriginal: true, isMonthly: false, grantedAt: "2026-05-01T10:00:00Z", expiresAt: "2026-10-31T23:59:59Z", benefits: ["Early Access", "Voting Rights", "Priority Participation"] },
  { id: "fm-4", userId: "u4", programmeId: "p2", locationId: "london", locationName: "London", audience: "CONSUMER", status: "EXPIRED", contributionAmount: 1500, isOriginal: false, isMonthly: false, grantedAt: "2026-01-15T10:00:00Z", expiresAt: "2026-07-15T23:59:59Z", benefits: ["Early Access"] },
  { id: "fm-5", userId: "u5", programmeId: "p3", locationId: "birmingham", locationName: "Birmingham", audience: "BUSINESS", status: "ACTIVE", contributionAmount: 8000, isOriginal: true, isMonthly: false, grantedAt: "2026-07-01T10:00:00Z", expiresAt: "2026-12-31T23:59:59Z", benefits: ["Early Access", "Voting Rights", "Founding Recognition"] },
  { id: "fm-6", userId: "u6", programmeId: "p3", locationId: "birmingham", locationName: "Birmingham", audience: "BUSINESS", status: "REVOKED", contributionAmount: 3000, isOriginal: false, isMonthly: true, grantedAt: "2026-04-01T10:00:00Z", benefits: ["Early Access"] },
  { id: "fm-7", userId: "u7", programmeId: "p1", locationId: "manchester", locationName: "Manchester", audience: "CONSUMER", status: "ACTIVE", contributionAmount: 2000, isOriginal: false, isMonthly: false, grantedAt: "2026-09-01T10:00:00Z", benefits: ["Early Access"] },
  { id: "fm-8", userId: "u8", programmeId: "p4", locationId: "leeds", locationName: "Leeds", audience: "BUSINESS", status: "ACTIVE", contributionAmount: 15000, isOriginal: true, isMonthly: false, grantedAt: "2026-03-01T10:00:00Z", expiresAt: "2026-08-31T23:59:59Z", benefits: ["Early Access", "Voting Rights", "Priority Participation", "Founding Recognition"] },
];

const USER_NAMES: Record<string, string> = {
  u1: "Sarah's Bakery", u2: "Tech Hub Manchester", u3: "James Wilson", u4: "Emily Chen",
  u5: "Green Valley Cafe", u6: "Old Town Pub", u7: "Lisa Taylor", u8: "Manchester Books Ltd",
};

export default function AdminFoundingMembersPage() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoundingMembership | null>(null);

  const { data: apiMembers } = useQuery({
    queryKey: ["admin-founding-members"],
    queryFn: () => foundingApi.getProgrammeMembers("all"),
    placeholderData: [],
  });

  const members = useMemo(() => {
    const base = apiMembers && apiMembers.length > 0 ? apiMembers : DEMO_FOUNDING_MEMBERS;
    let filtered = base;
    if (audienceFilter) filtered = filtered.filter((m) => m.audience === audienceFilter);
    if (statusFilter) filtered = filtered.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => {
        const name = USER_NAMES[m.userId] || m.userId;
        return name.toLowerCase().includes(q) || m.locationName?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      });
    }
    return filtered;
  }, [apiMembers, audienceFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.status === "ACTIVE").length,
    expired: members.filter((m) => m.status === "EXPIRED").length,
    revoked: members.filter((m) => m.status === "REVOKED").length,
    business: members.filter((m) => m.audience === "BUSINESS").length,
    consumer: members.filter((m) => m.audience === "CONSUMER").length,
    totalRevenue: members.filter((m) => m.status === "ACTIVE").reduce((s, m) => s + m.contributionAmount, 0),
  }), [members]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Founding Members</h1>
        <p className="text-sm text-gray-500">Manage founding programme members and their status.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{stats.active}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{stats.expired}</div>
          <div className="text-xs text-gray-500">Expired</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{stats.revoked}</div>
          <div className="text-xs text-gray-500">Revoked</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{fmt(stats.totalRevenue)}</div>
          <div className="text-xs text-gray-500">Revenue (Active)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, location, or ID..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        />
        <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value as AudienceFilter)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All Audiences</option>
          <option value="BUSINESS">Business</option>
          <option value="CONSUMER">Consumer</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 font-medium text-gray-500">Audience</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Location</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const badgeType = getFoundingBadgeType(m.audience, m.isOriginal, m.isMonthly);
              const name = USER_NAMES[m.userId] || m.userId;
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FoundingMemberBadge type={badgeType} size="sm" showLabel={false} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{name}</div>
                        {m.isOriginal && <span className="text-[10px] text-amber-600">Original Founder</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.audience === "BUSINESS" ? "bg-blue-100 text-blue-700" : "bg-primary-100 text-primary-700"
                    }`}>
                      {m.audience}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600">{m.locationName}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">{fmt(m.contributionAmount)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{m.isMonthly ? "Monthly" : "One-time"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      m.status === "EXPIRED" ? "bg-gray-100 text-gray-500" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(m)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No founding members found.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Member Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-800">{USER_NAMES[selected.userId] || selected.userId}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-800">{selected.locationName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Audience</span><span className="text-gray-800">{selected.audience}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{fmt(selected.contributionAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-gray-800">{selected.isMonthly ? "Monthly" : "One-time"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-gray-800">{selected.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Original</span><span className="text-gray-800">{selected.isOriginal ? "Yes" : "No"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Granted</span><span className="text-gray-800">{new Date(selected.grantedAt).toLocaleDateString("en-GB")}</span></div>
              {selected.expiresAt && <div className="flex justify-between"><span className="text-gray-500">Expires</span><span className="text-gray-800">{new Date(selected.expiresAt).toLocaleDateString("en-GB")}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Benefits</span><span className="text-gray-800">{selected.benefits.join(", ")}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
